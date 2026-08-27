export const todaysTransactions = [
  { id: "TXN-1049", time: "3:40 PM", employee: "Alice Johnson", method: "Card", gross: 4200, discount: 200, refund: 0 },
  { id: "TXN-1048", time: "3:12 PM", employee: "Robert Smith", method: "Cash", gross: 1350, discount: 0, refund: 0 },
  { id: "TXN-1047", time: "2:55 PM", employee: "Leonardo Ramos", method: "Mpesa", gross: 2600, discount: 0, refund: 2600 },
  { id: "TXN-1046", time: "2:30 PM", employee: "Michael Doe", method: "Cash", gross: 980, discount: 0, refund: 0 },
  { id: "TXN-1045", time: "1:58 PM", employee: "Alice Johnson", method: "Card", gross: 3150, discount: 315, refund: 0 },
  { id: "TXN-1044", time: "1:20 PM", employee: "Robert Smith", method: "Cash", gross: 1720, discount: 0, refund: 0 },
  { id: "TXN-1043", time: "12:44 PM", employee: "Leonardo Ramos", method: "Card", gross: 2400, discount: 0, refund: 0 },
  { id: "TXN-1042", time: "12:05 PM", employee: "Michael Doe", method: "Mpesa", gross: 1580, discount: 0, refund: 0 },
].map((txn) => {
  const net = txn.gross - txn.discount - txn.refund;
  return { ...txn, net, profit: Math.round(net * 0.4) };
});
