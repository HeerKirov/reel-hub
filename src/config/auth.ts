import { AuthOptions } from "next-auth"
import jwt from "jsonwebtoken"
import config from "@/config/config"

export const authOptions: AuthOptions = {
    providers: [
        {
            id: "auth-service",
            name: "Auth Service",
            type: "oauth",
            authorization: `${config.AUTH.URL}/authorize`,
            token: `${config.AUTH.URL}/api/token`,
            userinfo: `${config.AUTH.URL}/api/app/user/info`,
            clientId: config.AUTH.CLIENT_ID,
            clientSecret: config.AUTH.CLIENT_SECRET,
            client: {
                token_endpoint_auth_method: "client_secret_post"
            },
            checks: ["state"],
            profile(profile) {
                return {
                    id: profile["id"],
                    name: profile["displayName"],
                    image: profile["avatar"] ? `${config.AUTH.URL}${profile["avatar"]}` : null,
                    permissions: []
                }
            },
        }
    ],
    callbacks: {
        async jwt({ token, account, user }) {
            if(account && account.access_token) {
                const decodedToken = jwt.decode(account.access_token, {json: true})
                if(decodedToken && decodedToken["permissions"]) {
                    token.permissions = decodedToken.permissions
                    user.permissions = decodedToken.permissions
                }
            }

            return token
        },
        async session({ session, token }) {
            if(session.user && token.permissions) {
                session.user["permissions"] = token.permissions as {name: string, args: Record<string, unknown>}[]
            }
            if(token.sub) {
                session.user.id = token.sub
            }
            return session
        }
    },
    debug: false
}