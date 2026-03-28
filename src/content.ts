function main(): void {
  chrome.runtime.onMessage.addListener(() => {
    // reserved for popup/background messaging
  })
}

main()
