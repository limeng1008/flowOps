import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
@Index(['scopeId', 'idempotencyKey'], { unique: true })
export class EntitlementUsage {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: false, type: 'text' })
    entitlementId: string

    @Column({ nullable: false, type: 'text' })
    scopeId: string

    @Column({ nullable: false, type: 'varchar', length: 255 })
    idempotencyKey: string

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 64 })
    action: string

    @Column({ nullable: false, type: 'int', default: 0 })
    credits: number

    @Column({ nullable: true, type: 'text' })
    metadata?: string | null

    @CreateDateColumn()
    createdDate?: Date
}
