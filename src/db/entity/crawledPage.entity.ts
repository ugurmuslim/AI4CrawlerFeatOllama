import {Entity, PrimaryGeneratedColumn, Column, Unique} from 'typeorm';

@Entity('n8n_crawled_pages')
@Unique('unique_page', ['page'])
export class CrawledPageEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', length: 255, unique: true})
    page: string;

    @Column({type: 'date', default: () => 'CURRENT_DATE'})
    created_at: Date;

    @Column({type: 'date', default: () => 'CURRENT_DATE'})
    updated_at: Date;
}
