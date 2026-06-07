import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class PaymentNotificationLog {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: true, type: 'varchar', length: 64 })
    orderNo?: string | null

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 20 })
    provider: string

    @Column({ nullable: false, type: 'boolean', default: false })
    verified: boolean

    @Column({ nullable: false, type: 'text' })
    rawBody: string

    @Column({ nullable: false, type: 'varchar', length: 128 })
    headersDigest: string

    @Column({ nullable: true, type: 'text' })
    errorMessage?: string | null

    @Index()
    @CreateDateColumn()
    createdDate?: Date
}
