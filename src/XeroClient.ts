import XeroWrapper from './XeroWrapper'

let client = new XeroWrapper(null, true)

export const XeroClient = client
export const withXero: typeof client['withXero'] = client.withXero.bind(client)
export default withXero