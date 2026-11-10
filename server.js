import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import sequelize from './config/db.js';
import router from './routes/index.js';
import fileUpload from 'express-fileupload';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(fileUpload({}));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/static", express.static(path.resolve(__dirname, 'static')))
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use('/api', router);
const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync({ alter: true });
        app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
    } catch (error) {
        console.log(error);
    }
}

start();