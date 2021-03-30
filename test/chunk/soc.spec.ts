import { Bytes, verifyBytes } from '../../src/utils/bytes'
import { makeSingleOwnerChunk, verifySingleOwnerChunk, uploadSingleOwnerChunk } from '../../src/chunk/soc'
import { makeContentAddressedChunk } from '../../src/chunk/cac'
import { beeUrl, testIdentity, tryDeleteChunkFromLocalStorage } from '../utils'
import { makePrivateKeySigner } from '../../src/chunk/signer'
import * as chunkAPI from '../../src/modules/chunk'
import { HexString, hexToBytes, bytesToHex } from '../../src/utils/hex'

describe('soc', () => {
  const privateKey = verifyBytes(32, hexToBytes(testIdentity.privateKey))
  const signer = makePrivateKeySigner(privateKey)
  const payload = new Uint8Array([1, 2, 3])
  const socHash = '9d453ebb73b2fedaaf44ceddcf7a0aa37f3e3d6453fea5841c31f0ea6d61dc85' as HexString
  const identifier = new Uint8Array(32) as Bytes<32>

  test('single owner chunk creation', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())
    const owner = soc.owner()

    expect(socAddress).toEqual(socHash)
    expect(owner).toEqual(signer.address)
  })

  test('upload single owner chunk', async () => {
    const cac = makeContentAddressedChunk(payload)
    const soc = await makeSingleOwnerChunk(cac, identifier, signer)
    const socAddress = bytesToHex(soc.address())

    await tryDeleteChunkFromLocalStorage(socHash)

    const response = await uploadSingleOwnerChunk(beeUrl(), soc)

    expect(response).toEqual({ reference: socAddress })
  })

  test('download single owner chunk', async () => {
    const data = await chunkAPI.download(beeUrl(), socHash)
    const address = verifyBytes(32, hexToBytes(socHash))
    const soc = verifySingleOwnerChunk(data, address)
    const socAddress = soc.address()

    expect(socAddress).toEqual(address)
  })
})
