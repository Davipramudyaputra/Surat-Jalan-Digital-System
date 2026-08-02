type DeleteConfirmationState = {
  confirmationText: string;
  isAcknowledged: boolean;
  isPending: boolean;
  notPrintedCount: number;
  poNumber: string;
};

export function canSubmitDeleteConfirmation(
  state: DeleteConfirmationState,
): boolean {
  return (
    state.isAcknowledged &&
    state.confirmationText === state.poNumber &&
    !state.isPending
  );
}
