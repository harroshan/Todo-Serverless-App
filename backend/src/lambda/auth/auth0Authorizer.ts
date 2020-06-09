import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const jwksUrl = 'https://harroshan.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {

  logger.info('Authorizing a user', event.authorizationToken)
  try 
  {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const { header } = jwt;

  let key = await getSigningKey(jwksUrl, header.kid)
  return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload

}

 function  getToken(authHeader: string): string 
 {
   if (!authHeader) throw new Error('No authentication header')

   if (!authHeader.toLowerCase().startsWith('bearer '))
     throw new Error('Invalid authentication header')

   const split = authHeader.split(' ')
   const token = split[1]

   return token
 }

const getSigningKey = async (jwkurl, kid) => {
  let res = await Axios.get(jwkurl, {
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Origin": "*",
      'Access-Control-Allow-Credentials': true,
    }
  });
  
  let keys  = res.data.keys;
  const signingKeys = keys.filter(key => key.use === 'sig'
                                  && key.kty === 'RSA' 
                                  && key.kid           
                                  && key.x5c && key.x5c.length 
                                  ).map(key => {
                                    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
                                  });
  
  const signingKey = signingKeys.find(key => key.kid === kid);
  if(!signingKey)
  {
    logger.error("No signing keys found")
    throw new Error('Invalid signing keys')
  }

  logger.info("Signing keys created successfully ", signingKey)
  return signingKey

};

function certToPEM(cert) 
{
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----
  MIIDATCCAemgAwIBAgIJbSUb0Wiu1RS+MA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
  BAMTE2hhcnJvc2hhbi5hdXRoMC5jb20wHhcNMjAwNjA2MTYwMTQ5WhcNMzQwMjEz
  MTYwMTQ5WjAeMRwwGgYDVQQDExNoYXJyb3NoYW4uYXV0aDAuY29tMIIBIjANBgkq
  hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1deA4g9Ja9OiaR45EWPOLnWHf+Vb9xWu
  xzjRJkhvg3qcdL8aup/7yr0/9TjiMFU/j3vy/U47wb31SbUSeePd+WH5zOUt8A3n
  ZtZYcFEDieEoFSvuFbN9wiNwGG/Q4k9L2mzQ0OEiDvM0akupxFEmOdNk/djMxvXG
  JMUqkkhwC1Ser/pU/8lyCUUUAMYvShlbQcSnQ70e+3A4ufAv8MnPsXIGEnopgWWs
  LpQ3mXTkRN8QqUEGt6O1o/+rvznfwBPZGyQb8nRMOOab6zLZaUOGo9On5HZceIdP
  yVkbmfoDkeUs74OwzdD2FaOnBIG91SIBJvIpooYEpTHJ3t4anlOuYwIDAQABo0Iw
  QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBStovLbfpaXBXxQ6x90hCJNU3lO
  xzAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAAOD/YHJsvcEKUWL
  vGGeZhs5Y2O+hMv2EEgn+c/UYSCVqkMoroCrPLAJToeXYIy+x+jmfsEyRkdCHE7o
  GeuLEF9iau2Ig6USBfU1c006xQrQno5XlmkdFmZGA08LdSYaa6CXdDW67jCay5rc
  F8NAFp0u28ORCkk1H/mqLtxJD5ulV3rq2PnQfTd4ByLdgwPaU2NHAxu0b434oPBT
  yeGZs6/NaXTLBsDpLV6xIP99Ia1XBz6f3yoCkCfqJHYUjXOLrJfU98inZhkBEOum
  1zkBlTnZmlq6qn4ko9HFNZTP5zHx4NzrWQj32j5ZMV4eqq2sWflOWRRRFaEGqd+U
  +w7wP6A=
  -----END CERTIFICATE-----`;
  return cert;
}