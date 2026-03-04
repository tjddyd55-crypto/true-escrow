import {
  acceptInvite,
  addCondition,
  confirmCondition,
  countUnreadNotifications,
  createBlock,
  createInvite,
  createTrade,
  finalApproveBlock,
  getEmailQueueStats,
  listNotifications,
  listTransactionEvents,
  login,
  rejectConditionWithExtension,
  signup,
  submitCondition,
} from "./store";

type SimulationUser = {
  id: string;
  email: string;
};

async function ensureUser(email: string, password: string, name: string): Promise<SimulationUser> {
  try {
    const created = await signup({ email, password, name });
    return { id: created.id, email: created.email };
  } catch {
    const signedIn = await login({ email, password });
    if (!signedIn) {
      throw new Error(`Cannot ensure user: ${email}`);
    }
    return { id: signedIn.id, email: signedIn.email };
  }
}

export async function simulateTradeFlow() {
  console.info("[simulateTradeFlow] 1) ensure sample users");
  const password = "test1234!";
  const buyer = await ensureUser("buyer@test.com", password, "Buyer");
  const seller = await ensureUser("seller@test.com", password, "Seller");
  const approver = await ensureUser("approver@test.com", password, "Approver");

  console.info("[simulateTradeFlow] 2) create trade");
  const trade = await createTrade({
    title: `Simulation Trade ${new Date().toISOString()}`,
    description: "Notification + Email simulation",
    createdBy: buyer.id,
  });

  console.info("[simulateTradeFlow] 3) invite seller + accept");
  const sellerInvite = await createInvite({
    tradeId: trade.id,
    actorUserId: buyer.id,
    inviteType: "EMAIL",
    inviteTarget: seller.email,
    role: "SELLER",
  });
  await acceptInvite(sellerInvite.token, seller.id);

  console.info("[simulateTradeFlow] 4) invite approver + accept");
  const approverInvite = await createInvite({
    tradeId: trade.id,
    actorUserId: buyer.id,
    inviteType: "EMAIL",
    inviteTarget: approver.email,
    role: "VERIFIER",
  });
  await acceptInvite(approverInvite.token, approver.id);

  console.info("[simulateTradeFlow] 5) create block + condition");
  const block = await createBlock({
    tradeId: trade.id,
    actorUserId: buyer.id,
    title: "Simulation Block",
    startDate: "2026-02-17",
    dueDate: "2026-02-24",
    approvalType: "MANUAL",
    finalApproverRole: "VERIFIER",
    watchers: [],
  });

  const condition = await addCondition({
    tradeId: trade.id,
    blockId: block.id,
    actorUserId: buyer.id,
    title: "자료 제출",
    description: "텍스트/첨부 제출",
    type: "TEXT",
    required: true,
    assignedRole: "BUYER",
    confirmerRole: "SELLER",
  });

  console.info("[simulateTradeFlow] 6) submit -> reject -> resubmit -> confirm -> final approve");
  await submitCondition({
    tradeId: trade.id,
    blockId: block.id,
    conditionId: condition.id,
    actorUserId: buyer.id,
    answer: { text: "초기 제출", attachments: ["attachment://simulation-1"] },
  });
  await rejectConditionWithExtension({
    tradeId: trade.id,
    blockId: block.id,
    conditionId: condition.id,
    actorUserId: seller.id,
    rejectReason: "증빙 보완 필요",
    newDueDate: "2026-02-26",
  });
  await submitCondition({
    tradeId: trade.id,
    blockId: block.id,
    conditionId: condition.id,
    actorUserId: buyer.id,
    isResubmit: true,
    answer: { text: "재제출 완료", attachments: ["attachment://simulation-2"] },
  });
  await confirmCondition({
    tradeId: trade.id,
    blockId: block.id,
    conditionId: condition.id,
    actorUserId: seller.id,
  });
  await finalApproveBlock({
    tradeId: trade.id,
    blockId: block.id,
    actorUserId: approver.id,
  });

  const [events, buyerNotifications, sellerNotifications, approverNotifications, emailStats, badges] =
    await Promise.all([
      listTransactionEvents(trade.id, buyer.id),
      listNotifications(buyer.id),
      listNotifications(seller.id),
      listNotifications(approver.id),
      getEmailQueueStats(),
      Promise.all([
        countUnreadNotifications(buyer.id),
        countUnreadNotifications(seller.id),
        countUnreadNotifications(approver.id),
      ]),
    ]);

  const result = {
    tradeId: trade.id,
    eventsCount: events.length,
    notificationCountByUser: {
      buyer: buyerNotifications.length,
      seller: sellerNotifications.length,
      approver: approverNotifications.length,
    },
    unreadBadgeByUser: {
      buyer: badges[0],
      seller: badges[1],
      approver: badges[2],
    },
    emailQueue: emailStats,
  };

  console.info("[simulateTradeFlow] result", result);
  return result;
}
