import { XeroClient } from "xero-node";
import type { IXeroClientConfig } from "xero-node";

type LoggerFunctionType = (msg, level?: number) => void
type InitParamsType = {
    clientId: IXeroClientConfig['clientId'],
    clientSecret: IXeroClientConfig['clientSecret'],
    loggerFunction?: LoggerFunctionType
}

/**
 * Time prior to the actual token expiry that the Xero client should request a new token
 * Helps to ensure that a series of Xero requests won't encounter token invalidation errors
 * 
 * Set this to the maximum time a single series of Xero requests should take
 */
const EXPIRY_AHEAD_WINDOW = 30

export class XeroWrapper {
    #client: XeroClient;
    #loggerFunction: LoggerFunctionType
    #refreshPromise: Promise<void>

    /**
     * Could turn this into a decorator, but then I need to enable some experimental flags
     */
    #assertInit() {
        if (!this.#client) throw new Error("XeroWrapper not initialised")
    }

    constructor(params?: InitParamsType, acknowledgeNullParams = false) {
        if (!params) {
            if (!acknowledgeNullParams) throw new Error("XeroWrapper missing parameters without acknowledgement")
        } else {
            this.init(params)
        }
    }

    init({ clientId, clientSecret, loggerFunction }: InitParamsType
    ) {
        if (this.#client) throw new Error("XeroWrapper already initialised")

        this.#client = new XeroClient({
            clientId,
            clientSecret,
            grantType: 'client_credentials'
        })

        if (loggerFunction) this.#loggerFunction = loggerFunction
    }

    setLogger(loggerFunction: LoggerFunctionType) {
        this.#loggerFunction = loggerFunction
    }

    #log(...args: Parameters<LoggerFunctionType>) {
        this.#loggerFunction && this.#loggerFunction(...args)
    }


    // >= TS4.5 - type T = Awaited<Promise<PromiseLike<number>> // => number 
    // <= TS4.4 - type Awaited<T> = T extends PromiseLike<infer U> ? U : T
    async withXero<T>(fn: (client: XeroClient) => T): Promise<T extends PromiseLike<infer ReturnType> ? ReturnType : T> {
        this.#assertInit()

        let auth = this.#client.readTokenSet()
        if (!auth.access_token || (auth.expires_at + EXPIRY_AHEAD_WINDOW) * 1000 < new Date().getTime()) {
            if (!this.#refreshPromise) {
                if (!auth.access_token) this.#log("Requesting Xero token")
                else this.#log("Xero token expired, refreshing")

                this.#refreshPromise = this.#client.getClientCredentialsToken()
                    .then(() => {
                        this.#log("Got new token")
                    })
                    .catch(() => {
                        this.#log("Failed to get new token")
                    }).finally(() => {
                        this.#refreshPromise = null
                    })
            } else {
                this.#log("Waiting for existing token request")
            }

            await this.#refreshPromise
        }

        return <any>fn(this.#client)
    }
}

export default XeroWrapper