import { DataSource } from 'typeorm';
import {CrawledPageEntity} from "./entity/crawledPage.entity";

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'root',
    password: 'password',
    database: 'n8n',
    synchronize: true, // Set to false in production
    logging: true,
    entities: [__dirname + '/../**/*.entity.{js,ts}'],
    migrations: [],
    subscribers: [],
});

export default AppDataSource;
