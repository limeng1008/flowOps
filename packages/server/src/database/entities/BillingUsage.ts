import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class BillingUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: false, type: 'text' })
    organizationId: string

    @Column({ nullable: true, type: 'text' })
    workspaceId?: string | null

    @Column({ nullable: true, type: 'text' })
    chatflowId?: string | null

    @Column({ type: 'varchar', length: 30 })
    source: string

    @Column({ nullable: true, type: 'text' })
    sourceId?: string | null

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    dedupeKey: string

    @Index()
    @Column({ type: 'varchar', length: 7 })
    period: string

    @Column({ type: 'int', default: 0 })
    inputTokens: number

    @Column({ type: 'int', default: 0 })
    outputTokens: number

    @Column({ type: 'int', default: 0 })
    totalTokens: number

    @CreateDateColumn()
    createdDate?: Date
}
