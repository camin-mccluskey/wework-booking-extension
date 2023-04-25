import {
  BookDeskMessage,
  BookDeskStatus,
  ErrorMessage,
  ExtensionMessage,
  ExtensionMessageType,
  QueryAvailabilityMessage,
  SuccessMessage,
} from '../types'
import WeWork from './wework'

console.info('chrome-ext template-react-ts background script')

async function getAccessToken() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const { id: tabId } = tab
  if (!tabId) throw new Error('No active tab')
  const authInfoStrArray = await chrome.scripting.executeScript({
    target: { tabId },
    func: () =>
      localStorage.getItem(
        '@@auth0spajs@@::ssINyYvYoBHSW8pOcoAE0f5Kzrbd6cmb::wework::openid profile email offline_access',
      ),
  })
  if (!(authInfoStrArray && authInfoStrArray[0]))
    throw new Error('No Auth0 blob in Localstorage')
  const {
    body: { access_token: accessToken },
  } = JSON.parse(authInfoStrArray[0].result as string)
  if (!accessToken) throw new Error('No access token found')
  return accessToken as string
}


async function handleQueryAvailability(request: ExtensionMessage<QueryAvailabilityMessage>): Promise<ExtensionMessage<SuccessMessage | ErrorMessage>> {
  try {
    const { startDate, endDate, inventoryUuid } = request.message
    const accessToken = await getAccessToken()
    const weworkApi = await WeWork.build(accessToken)
  } catch (error) {
    return {
      type: ExtensionMessageType.ERROR,
      message: `Error: ${error}` as ErrorMessage,
    }

  }
}

// handles book desk message from popup component, using the WeWork API
async function handleBookDesk(
  request: ExtensionMessage<BookDeskMessage>,
): Promise<ExtensionMessage<SuccessMessage | ErrorMessage>> {
  try {
    const { startDate, endDate, inventoryUuid } = request.message
    const accessToken = await getAccessToken()
    const weworkApi = await WeWork.build(accessToken)
    const bookingResponse = await weworkApi.bookDesk(startDate, inventoryUuid, 1, endDate)
    if (bookingResponse === BookDeskStatus.SUCCESS) {
      return {
        type: ExtensionMessageType.SUCCESS,
        message: 'Booking was successful',
      }
    } else {
      return {
        type: ExtensionMessageType.ERROR,
        message: 'Failed to book',
      }
    }
  } catch (error) {
    return {
      type: ExtensionMessageType.ERROR,
      message: `Error: ${error}` as ErrorMessage,
    }
  }
}

chrome.runtime.onMessage.addListener((req: ExtensionMessage<BookDeskMessage>, _, sendResponse) => {
  switch (req.type) {
    case ExtensionMessageType.BOOK_DESK:
      handleBookDesk(req).then(sendResponse)
    case ExtensionMessageType.QUERY_AVAILABILITY:
      handleQueryAvailability(req).then(sendResponse)
    default:
      break
  }
  return true
})

export {}
