import { useEffect, useState } from 'react'
import Calendar from 'react-calendar'
import { Value } from 'react-calendar/dist/cjs/shared/types'
import 'react-calendar/dist/Calendar.css'
import './Popup.css'
import { BookDeskMessage, ExtensionMessage, ExtensionMessageType } from '../types'
import weworkLocations from './weworkLocations'

// only render content on *members.wework.*
let SHOW = false
const weworkDomainRegex = new RegExp(
  '^((http|https):\\/\\/)?(www.)?(?!.*(http|https|www.))members.wework.*',
  'gm',
)
chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
  const [tab] = tabs
  SHOW = !!(tab.url && weworkDomainRegex.test(tab.url))
})

const msgHelper = (
  prefix: string,
  officeName: string,
  dateRange: [Date, Date | null],
  postfix?: string,
) => {
  const [startDate, endDate] = dateRange
  if (endDate) {
    return `${prefix} ${officeName}. From ${startDate.toDateString()} to ${endDate.toDateString()}. ${
      postfix ?? ''
    }`
  } else {
    return `${prefix} ${officeName}. On ${startDate.toDateString()}. ${postfix ?? ''}`
  }
}

function App() {
  const [dateRange, setDateRange] = useState<Value>([new Date(), null])
  const [weworkLocationIdx, setWeworkLocationidx] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const msg = msgHelper(
      'Draft booking for:',
      weworkLocations[weworkLocationIdx].name,
      dateRange as [Date, Date | null],
      "Press 'Confirm Selection' to book.",
    )
    setProgressMsg(msg)
  }, [weworkLocationIdx, dateRange])

  const confirmSelection = async () => {
    setError('')
    setProgressMsg('')

    const msg = msgHelper(
      'Booking a desk at:',
      weworkLocations[weworkLocationIdx].name,
      dateRange as [Date, Date | null],
    )
    setProgressMsg(msg)

    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    if (!tab.id) {
      setProgressMsg('')
      setError('Navigate to WeWork membership page')
      return
    }

    const [startDate, endDate] = dateRange as [Date, Date | null]
    const response: ExtensionMessage<BookDeskMessage> = await chrome.runtime.sendMessage<
      ExtensionMessage<BookDeskMessage>
    >({
      type: ExtensionMessageType.BOOK_DESK,
      message: {
        startDate,
        endDate,
        inventoryUuid: weworkLocations[weworkLocationIdx].inventoryUuid,
      },
    })
    if (response.type === ExtensionMessageType.ERROR) {
      setProgressMsg('')
      setError('Something went wrong with your booking')
      console.error(response)
    } else if (response.type === ExtensionMessageType.SUCCESS) {
      setError('')
      setProgressMsg(
        `Your booking at ${weworkLocations[weworkLocationIdx].name} is confirmed! Check your email for a confirmation`,
      )
    } else {
      setProgressMsg('')
      setError('Something went wrong with this extension. Try reloading the page')
    }
  }

  return (
    <main>
      <h3>Book a WeWork London Desk</h3>
      {SHOW ? (
        <>
          <select onChange={(e) => setWeworkLocationidx(parseInt(e.target.value))}>
            {weworkLocations.map((location, idx) => (
              <option key={idx} value={idx}>
                {location.name}
              </option>
            ))}
          </select>
          <Calendar
            value={dateRange}
            onChange={(val) => setDateRange(val)}
            selectRange
            className="cal"
          />
          <button onClick={confirmSelection} style={{ padding: 5, marginTop: 5 }}>
            Confirm Selection
          </button>
          <p style={{ color: 'yellow' }}>{progressMsg}</p>
          <p style={{ color: 'red' }}>{error}</p>
        </>
      ) : (
        <p>
          Navigate to{' '}
          <a href="https://members.wework.com" target="_blank">
            WeWork Member Portal
          </a>{' '}
          to use this extension
        </p>
      )}
    </main>
  )
}

export default App
