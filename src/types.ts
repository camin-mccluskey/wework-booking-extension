export enum ExtensionMessageType {
  BOOK_DESK = 'BOOK_DESK',
  QUERY_AVAILABILITY = 'QUERY_AVAILABILITY',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
}

export type ExtensionMessage<T> = {
  type: ExtensionMessageType
  message: T
}

export type BookDeskMessage = {
  startDate: Date
  endDate: Date | null
  inventoryUuid: string
}

export type QueryAvailabilityMessage = {
  startDate: Date
  endDate: Date | null
  inventoryUuid: string
}

export enum BookDeskStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export type ErrorMessage = string
export type SuccessMessage = string
