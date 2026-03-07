import { client } from "../../config/redis.js";

interface ipstructure{
    ip:string,
    endpoint:string,
    statusCode:Number,
    responseSize:Number,
}

export const writeIPData = async (ipstructure: ipstructure): Promise<void> => {
    

}