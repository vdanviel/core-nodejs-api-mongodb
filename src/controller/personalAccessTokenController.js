import { PersonalAccessToken } from "../model/personalAccessToken.js";
import { ObjectId } from 'mongodb';

class Controller {

    async register(tokenableType = null, tokenableId = null, name = null, secret = null, token = null, abilities = null, lastUsedAt = null, expiresAt = null) {
        
        const newToken = {
            tokenable_type: tokenableType,
            tokenable_id: tokenableId,
            name: name,
            secret: secret,
            token: token,
            abilities: abilities,
            last_used_at: lastUsedAt ? new Date(lastUsedAt) : null,
            expires_at: expiresAt ? new Date(expiresAt) : null,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await PersonalAccessToken.insertOne(newToken);
        return { ...newToken, _id: result.insertedId };
    }

    async verifyByCode(code) {
        const personalAT = await PersonalAccessToken.findOne({ token: code });
        
        if (!personalAT) {
            return { error: "Código de recuperação é inválido." };
        }

        const tokenExpiresAtTime = new Date(personalAT.expires_at);
        const currentTime = new Date();

        if (currentTime.getTime() > tokenExpiresAtTime.getTime()) {
            return { error: "Código de recuperação expirado." };
        }

        return personalAT;
    }

    async verifyBySecret(secret) {
        const personalAT = await PersonalAccessToken.findOne({ secret: secret });
        
        if (!personalAT) {
            return { error: "Código de recuperação é inválido." };
        }

        const tokenExpiresAtTime = new Date(personalAT.expires_at);
        const currentTime = new Date();

        if (currentTime.getTime() > tokenExpiresAtTime.getTime()) {
            return { error: "Código de recuperação expirado." };
        }

        return personalAT;
    }

    async deleteAllRelated(customerId) {
        const result = await PersonalAccessToken.deleteMany({
            tokenable_id: customerId,
            tokenable_type: "forgot_password"
        });

        if (result.deletedCount === 0) {
            return { error: "Não há tokens reservados para este usuário." };
        }

        return { message: "Os tokens foram deletados com sucesso." };
    }
}

const PersonalAccessTokenController = new Controller();
export { PersonalAccessTokenController };