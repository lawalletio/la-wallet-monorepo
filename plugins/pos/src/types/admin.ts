export interface InfoResponse {
  tag: 'laWallet:info'
  info: {
    status: {
      initialized: boolean
      associated: boolean
      activated: boolean
      hasDelegation: boolean
      hasIdentity: boolean
    }
    ntag424: {
      ok: {
        cid: string
        ctr: number
        ctrNew: number
        otc: string | null
        design: {
          uuid: string
          name: string
        }
      }
    } | null
    card: {
      ok: {
        uuid: string
        name: string
        description: string
        enabled: boolean
      }
    } | null
    holder?: {
      ok: {
        pubKey: string
        delegations: {
          kind: number | null
          since: string
          until: string
          isCurrent: boolean
          delegationConditions: string
          delegationToken: string
        }[]
      }
    }
    identity?: {
      name: string
    }
  }
}

export interface ResetResponse {
  nonce: string
  name: string
}
