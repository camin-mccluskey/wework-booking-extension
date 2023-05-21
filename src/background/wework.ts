import { v4 as uuidV4 } from 'uuid'
import moment from 'moment'
import { BookDeskStatus } from '../types'

export default class WeWork {
  userUuid?: string
  userMembershipUuid?: string
  accountUuid?: string
  accessToken?: string

  static async build(accessToken: string) {
    const { userUuid, userMembershipUuid, accountUuid } = await WeWork.getMembershipInfo(
      accessToken,
    )
    return new WeWork(userUuid, userMembershipUuid, accountUuid, accessToken)
  }

  private constructor(
    userUuid?: string,
    userMembershipUuid?: string,
    accountUuid?: string,
    accessToken?: string,
  ) {
    this.userUuid = userUuid
    this.userMembershipUuid = userMembershipUuid
    this.accountUuid = accountUuid
    this.accessToken = accessToken
  }


  async getDeskAvailability(inventoryUuid: string, startDate: Date, endDate: Date | null) {
    return 'not implemented'
  }

  async bookDesk(startDate: Date, inventoryUuid: string, quantity = 1, endDate: Date | null) {
    const quoteIds = await this.requestQuotes(startDate, inventoryUuid, quantity, endDate)
    if (!quoteIds) throw new Error('Booking failed: not able to generate quote for order')
    // sleep to allow quote to get to READY state
    await new Promise((_) => setTimeout(_, 3000))
    return await Promise.all(quoteIds.map(quoteId => this.bookOrder(quoteId)))
  }

  private static async getMembershipInfo(accessToken: string) {
    const res = await fetch('https://mx-gql.wework.com/graphql', {
      body: JSON.stringify({
        operationName: 'UserMemberships',
        variables: {
          membershipInput: {
            active: true,
          },
        },
        query:
          'query UserMemberships($membershipInput: MembershipInput) {\n  userMemberships(membershipInput: $membershipInput) {\n    uuid\n    userUuid\n    accountUuid\n    membershipType\n    productUuid\n    productName\n    __typename\n  }\n}\n',
      }),
      headers: {
        Accept: '*/*',
        'Apollographql-Client-Name': 'member-web-mx-gql-client',
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Dnt: '1',
        'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS "',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'X-Request-Id': uuidV4(),
      },
      method: 'POST',
    })
    const data = await res.json()
    if (data?.data?.userMemberships.length > 0) {
      const { uuid: userMembershipUuid, userUuid, accountUuid } = data.data.userMemberships[0]
      return { userMembershipUuid, userUuid, accountUuid }
    }
    throw new Error('could not initialise WeWork')
  }

  private async requestQuotes(
    startDate: Date,
    inventoryUuid: string,
    quantity = 1,
    endDate: Date | null,
  ) {
    const startDateMoment = moment(startDate)
    const endDateMoment = endDate ? moment(endDate) : startDateMoment
    const quoteUuids: string[] = []
    while (startDateMoment.isSameOrBefore(endDateMoment)) {
      const quoteUuid = await this.requestQuoteForDay(startDateMoment, inventoryUuid, quantity)
      quoteUuids.push(quoteUuid)
      startDateMoment.add(1, 'days')
    }
    return quoteUuids
  }

  private async requestQuoteForDay(
    startDateMoment: moment.Moment,
    inventoryUuid: string,
    quantity = 1,
  ) {
    startDateMoment.startOf('day')
    const startTime = startDateMoment.format()
    const endTime = startDateMoment.endOf('day').format()

    const res = await fetch('https://mx-gql.wework.com/graphql', {
      body: JSON.stringify({
        operationName: 'RequestQuote',
        variables: {
          items: {
            currency: 'com.wework.credits',
            userUuid: this.userUuid,
            userMembershipUuid: this.userMembershipUuid,
            lineItems: [
              {
                lineItemType: 'SharedWorkspace',
                startTime,
                endTime,
                inventoryUuid,
                quantity,
              },
            ],
          },
        },
        query:
          'mutation RequestQuote($items: RequestQuoteInput!) {\n  requestQuote(items: $items) {\n    uuid\n    quoteStatus\n    detail\n    error\n    message\n    __typename\n  }\n}\n',
      }),
      headers: {
        Accept: '*/*',
        'Apollographql-Client-Name': 'member-web-mx-gql-client',
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Dnt: '1',
        'Sec-Ch-Ua': 'Not:A-Brand";v="99", "Chromium";v="112"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'X-Request-Id': uuidV4(),
      },
      method: 'POST',
    })
    const data = await res.json()
    return data?.data?.requestQuote?.uuid
  }

  private async bookOrder(quoteUuid: string) {
    const res = await fetch('https://mx-gql.wework.com/graphql', {
      body: JSON.stringify({
        operationName: 'PlaceOrder',
        variables: {
          order: {
            userUuid: this.userUuid,
            accountUuid: this.accountUuid,
            requesterUuid: this.userUuid,
            quoteUuid,
          },
        },
        query:
          'mutation PlaceOrder($order: PlaceOrderInput!) {\n  placeOrder(order: $order) {\
uuid\n    orderStatus\n    detail\n    error\n    message\n    __typename\n  }\n}\n',
      }),
      headers: {
        Accept: '*/*',
        'Apollographql-Client-Name': 'member-web-mx-gql-client',
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        Dnt: '1',
        'Sec-Ch-Ua': '"Not:A-Brand";v="99", "Chromium";v="112"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'X-Request-Id': uuidV4(),
      },
      method: 'POST',
    })
    const data = await res.json()
    return data?.data?.placeOrder?.orderStatus === 'PLACED'
      ? BookDeskStatus.SUCCESS
      : BookDeskStatus.FAILURE
  }
}
