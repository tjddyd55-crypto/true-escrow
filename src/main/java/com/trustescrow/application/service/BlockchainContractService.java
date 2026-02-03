package com.trustescrow.application.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.web3j.abi.FunctionEncoder;
import org.web3j.abi.FunctionReturnDecoder;
import org.web3j.abi.TypeReference;
import org.web3j.abi.datatypes.Function;
import org.web3j.abi.datatypes.Type;
import org.web3j.abi.datatypes.generated.Uint8;
import org.web3j.crypto.Credentials;
import org.web3j.crypto.Hash;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.core.DefaultBlockParameterName;
import org.web3j.protocol.core.methods.request.Transaction;
import org.web3j.protocol.core.methods.response.EthCall;
import org.web3j.protocol.core.methods.response.EthSendTransaction;
import org.web3j.protocol.core.methods.response.TransactionReceipt;
import org.web3j.protocol.http.HttpService;
import org.web3j.utils.Numeric;

import java.math.BigInteger;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * STEP 7-B: Blockchain Contract Service
 * 
 * Handles direct interaction with EscrowStatusRegistry smart contract.
 * 
 * Responsibilities:
 * - Record milestone status on-chain (FUNDS_HELD, RELEASED, REFUNDED)
 * - Check if status is already recorded (idempotency)
 * - Handle transaction confirmation
 * 
 * Security:
 * - Uses backend wallet private key (from .env)
 * - No public write access
 * - All writes go through this service
 */
@Service
@Slf4j
public class BlockchainContractService {
    
    private final Web3j web3j;
    private final Credentials credentials;
    private final String contractAddress;
    private final boolean enabled;
    
    public BlockchainContractService(
            @Value("${blockchain.enabled:false}") boolean enabled,
            @Value("${blockchain.rpc-url:}") String rpcUrl,
            @Value("${blockchain.contract-address:}") String contractAddress,
            @Value("${blockchain.private-key:}") String privateKey) {
        
        this.enabled = enabled;
        this.contractAddress = contractAddress;
        
        if (!enabled) {
            log.warn("[BLOCKCHAIN] Blockchain integration is disabled");
            this.web3j = null;
            this.credentials = null;
            return;
        }
        
        if (contractAddress == null || contractAddress.isEmpty()) {
            log.warn("[BLOCKCHAIN] Contract address not configured");
            this.web3j = null;
            this.credentials = null;
            return;
        }
        
        if (privateKey == null || privateKey.isEmpty()) {
            log.warn("[BLOCKCHAIN] Private key not configured");
            this.web3j = null;
            this.credentials = null;
            return;
        }
        
        try {
            this.web3j = Web3j.build(new HttpService(rpcUrl));
            this.credentials = Credentials.create(privateKey);
            log.info("[BLOCKCHAIN] Initialized: contract={}, wallet={}", 
                contractAddress, credentials.getAddress());
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Failed to initialize: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to initialize blockchain service", e);
        }
    }
    
    /**
     * STEP 7-B: Record milestone status on-chain.
     * 
     * @param dealId deal ID (UUID string)
     * @param milestoneId milestone ID (UUID string)
     * @param status status to record (0: FUNDS_HELD, 1: RELEASED, 2: REFUNDED)
     * @return transaction hash if successful, empty if disabled or failed
     */
    public Optional<String> recordStatus(String dealId, String milestoneId, int status) {
        if (!enabled || web3j == null || credentials == null) {
            log.debug("[BLOCKCHAIN] Blockchain disabled or not configured, skipping on-chain record");
            return Optional.empty();
        }
        
        try {
            // Convert dealId and milestoneId to bytes32 hashes
            byte[] dealHashBytes = Hash.sha3(dealId.getBytes());
            byte[] milestoneHashBytes = Hash.sha3(milestoneId.getBytes());
            
            org.web3j.abi.datatypes.generated.Bytes32 dealHash = 
                new org.web3j.abi.datatypes.generated.Bytes32(dealHashBytes);
            org.web3j.abi.datatypes.generated.Bytes32 milestoneHash = 
                new org.web3j.abi.datatypes.generated.Bytes32(milestoneHashBytes);
            Uint8 statusParam = new Uint8(BigInteger.valueOf(status));
            
            // Build function call
            Function function = new Function(
                "recordStatus",
                Arrays.asList(dealHash, milestoneHash, statusParam),
                Collections.emptyList()
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            // Get nonce
            BigInteger nonce = web3j.ethGetTransactionCount(
                credentials.getAddress(), 
                DefaultBlockParameterName.LATEST
            ).send().getTransactionCount();
            
            // Build transaction
            org.web3j.tx.gas.DefaultGasProvider gasProvider = 
                new org.web3j.tx.gas.DefaultGasProvider();
            
            Transaction transaction = Transaction.createFunctionCallTransaction(
                credentials.getAddress(),
                nonce,
                gasProvider.getGasPrice(),
                gasProvider.getGasLimit(),
                contractAddress,
                encodedFunction
            );
            
            // Sign and send transaction
            org.web3j.crypto.RawTransaction rawTransaction = org.web3j.crypto.RawTransaction.createTransaction(
                nonce,
                gasProvider.getGasPrice(),
                gasProvider.getGasLimit(),
                contractAddress,
                encodedFunction
            );
            
            byte[] signedMessage = org.web3j.crypto.TransactionEncoder.signMessage(rawTransaction, credentials);
            String hexValue = Numeric.toHexString(signedMessage);
            
            EthSendTransaction ethSendTransaction = web3j.ethSendRawTransaction(hexValue).send();
            
            if (ethSendTransaction.hasError()) {
                log.error("[BLOCKCHAIN] Transaction failed: {}", ethSendTransaction.getError().getMessage());
                return Optional.empty();
            }
            
            String txHash = ethSendTransaction.getTransactionHash();
            log.info("[BLOCKCHAIN] Transaction sent: txHash={}, dealId={}, milestoneId={}, status={}", 
                txHash, dealId, milestoneId, status);
            
            return Optional.of(txHash);
            
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Error recording status on-chain: dealId={}, milestoneId={}, status={}, error={}", 
                dealId, milestoneId, status, e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * STEP 7-B: Check if status is already recorded on-chain.
     * 
     * @param dealId deal ID (UUID string)
     * @param milestoneId milestone ID (UUID string)
     * @param status status to check (0: FUNDS_HELD, 1: RELEASED, 2: REFUNDED)
     * @return true if recorded, false otherwise
     */
    public boolean isRecorded(String dealId, String milestoneId, int status) {
        if (!enabled || web3j == null) {
            return false;
        }
        
        try {
            // Convert to bytes32 hashes
            byte[] dealHashBytes = Hash.sha3(dealId.getBytes());
            byte[] milestoneHashBytes = Hash.sha3(milestoneId.getBytes());
            
            org.web3j.abi.datatypes.generated.Bytes32 dealHash = 
                new org.web3j.abi.datatypes.generated.Bytes32(dealHashBytes);
            org.web3j.abi.datatypes.generated.Bytes32 milestoneHash = 
                new org.web3j.abi.datatypes.generated.Bytes32(milestoneHashBytes);
            Uint8 statusParam = new Uint8(BigInteger.valueOf(status));
            
            // Build function call
            Function function = new Function(
                "isRecorded",
                Arrays.asList(dealHash, milestoneHash, statusParam),
                Arrays.asList(new TypeReference<org.web3j.abi.datatypes.Bool>() {})
            );
            
            String encodedFunction = FunctionEncoder.encode(function);
            
            EthCall response = web3j.ethCall(
                Transaction.createEthCallTransaction(null, contractAddress, encodedFunction),
                DefaultBlockParameterName.LATEST
            ).send();
            
            if (response.hasError()) {
                log.error("[BLOCKCHAIN] Call failed: {}", response.getError().getMessage());
                return false;
            }
            
            List<Type> decoded = FunctionReturnDecoder.decode(
                response.getValue(), 
                function.getOutputParameters()
            );
            
            if (decoded.isEmpty()) {
                return false;
            }
            
            return (Boolean) decoded.get(0).getValue();
            
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Error checking if recorded: dealId={}, milestoneId={}, status={}, error={}", 
                dealId, milestoneId, status, e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Get transaction receipt (for confirmation).
     */
    public Optional<TransactionReceipt> getTransactionReceipt(String txHash) {
        if (!enabled || web3j == null) {
            return Optional.empty();
        }
        
        try {
            return web3j.ethGetTransactionReceipt(txHash).send().getTransactionReceipt();
        } catch (Exception e) {
            log.error("[BLOCKCHAIN] Error getting transaction receipt: txHash={}, error={}", 
                txHash, e.getMessage(), e);
            return Optional.empty();
        }
    }
}
