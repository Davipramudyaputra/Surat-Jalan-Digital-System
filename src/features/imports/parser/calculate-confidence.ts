export type ConfidenceSignals = {
  branchHeaderFound: boolean;
  dataRowCount: number;
  poNumberFound: boolean;
  productColumnCount: number;
  quantityErrorCount: number;
  quantityValueCount: number;
  rowConsistency: number;
};

export function calculateConfidence(signals: ConfidenceSignals): number {
  let confidence = 0;

  if (signals.branchHeaderFound) {
    confidence += 20;
  }

  if (signals.productColumnCount > 0) {
    confidence += Math.min(20, 10 + signals.productColumnCount);
  }

  if (signals.dataRowCount > 0) {
    confidence += Math.min(15, 10 + Math.floor(signals.dataRowCount / 10));
  }

  if (signals.poNumberFound) {
    confidence += 20;
  }

  const observedQuantities =
    signals.quantityValueCount + signals.quantityErrorCount;

  if (observedQuantities > 0) {
    confidence += Math.round(
      (signals.quantityValueCount / observedQuantities) * 15,
    );
  }

  confidence += Math.round(
    Math.max(0, Math.min(1, signals.rowConsistency)) * 10,
  );

  return Math.max(0, Math.min(100, confidence));
}
