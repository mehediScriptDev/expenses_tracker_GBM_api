import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { retentionJob } from "./jobs/retention.job";

const PORT = config.port;
const main = async () => {
    try {
        await prisma.$connect();
        retentionJob.startRetentionScheduler();
        app
        .listen(PORT,()=>{
            console.log("server is running gorib");
        })
    } catch (error) {
        console.log(error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();