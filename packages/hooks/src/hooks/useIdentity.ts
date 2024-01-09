import { STORAGE_IDENTITY_KEY } from '../constants/constants.js'
import { parseContent } from '@repo/utils'
import { type UserIdentity, defaultIdentity, getUsername } from '@repo/utils'
import { getPublicKey } from 'nostr-tools'
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

export interface UserReturns {
  identity: UserIdentity
  setUser: Dispatch<SetStateAction<UserIdentity>>
}

export const useIdentity = () => {
  const [identity, setIdentity] = useState<UserIdentity>(defaultIdentity)

  const setDefaultIdentity = () => {
    setIdentity({
      ...defaultIdentity,
      loaded: true
    })
  }

  const loadStoragedIdentity = async () => {
    const storageIdentity = localStorage.getItem(STORAGE_IDENTITY_KEY)
    if (!storageIdentity) return setDefaultIdentity()

    const parsedIdentity: UserIdentity = parseContent(storageIdentity)
    if (!parsedIdentity.privateKey) return setDefaultIdentity()

    const hexpub: string = getPublicKey(parsedIdentity.privateKey)
    const username: string = await getUsername(hexpub)

    if (
      hexpub === parsedIdentity.hexpub &&
      username == parsedIdentity.username
    ) {
      setIdentity({
        ...parsedIdentity,
        loaded: true
      })
    } else {
      setIdentity({
        ...parsedIdentity,
        hexpub,
        username,
        loaded: true
      })
    }

    return
  }

  useEffect(() => {
    loadStoragedIdentity()
  }, [])

  return {
    identity,
    setIdentity
  }
}
