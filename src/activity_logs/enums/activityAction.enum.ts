export enum ActivityAction {
  ClientCreated = 'CLIENT_CREATED',
  ClientUpdated = 'CLIENT_UPDATED',
  ClientDeleted = 'CLIENT_DELETED',

  PlanCreated = 'PLAN_CREATED',
  PlanFrozen = 'PLAN_FROZEN',
  PlanUnfrozen = 'PLAN_UNFROZEN',
  PlanNotesUpdated = 'PLAN_NOTES_UPDATED',

  PaymentRecorded = 'PAYMENT_RECORDED',
  PaymentReversed = 'PAYMENT_REVERSED',

  AdminLevelChanged = 'ADMIN_LEVEL_CHANGED',
}