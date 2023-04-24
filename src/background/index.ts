import {
  BookDeskMessage,
  BookDeskStatus,
  ErrorMessage,
  ExtensionMessage,
  ExtensionMessageType,
  SuccessMessage,
} from '../types'
import WeWork from './wework'

console.info('chrome-ext template-react-ts background script')

// handles message from popup component, using the WeWork API
async function handleRequest(
  request: ExtensionMessage<BookDeskMessage>,
): Promise<ExtensionMessage<SuccessMessage | ErrorMessage>> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const { id: tabId } = tab
  if (!tabId) return { type: ExtensionMessageType.ERROR, message: 'No active tab' }
  const authInfoStrArray = await chrome.scripting.executeScript({
    target: { tabId },
    func: () =>
      localStorage.getItem(
        '@@auth0spajs@@::ssINyYvYoBHSW8pOcoAE0f5Kzrbd6cmb::wework::openid profile email offline_access',
      ),
  })
  if (!(authInfoStrArray && authInfoStrArray[0]))
    return { type: ExtensionMessageType.ERROR, message: 'No auth0 blob in Localstorage' }
  const {
    body: { access_token: accessToken },
  } = JSON.parse(authInfoStrArray[0].result as string)
  if (!accessToken) return { type: ExtensionMessageType.ERROR, message: 'No access token found' }

  try {
    const { startDate, endDate, inventoryUuid } = request.message
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
  handleRequest(req).then(sendResponse)
  return true
})

export {}
