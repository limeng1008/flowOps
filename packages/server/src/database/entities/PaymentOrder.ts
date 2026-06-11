import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum PaymentOrderProvider {
    ALIPAY = 'alipay',
    WECHAT = 'wechat'
}

export enum PaymentOrderStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    CLOSED = 'closed'
}

@Entity()
export class PaymentOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 64, unique: true })
    orderNo: string

    @Index()
    @Column({ nullable: false, type: 'text' })
    organizationId: string

    @Column({ nullable: false, type: 'varchar', length: 50 })
    planCode: string

    @Column({ nullable: false, type: 'varchar', length: 20 })
    provider: string

    @Column({ type: 'int' })
    amountCents: number

    @Column({ type: 'varchar', length: 10, default: 'CNY' })
    currency: string

    @Column({ type: 'varchar', length: 20, default: PaymentOrderStatus.PENDING })
    status: string

    @Column({ nullable: true, type: 'varchar', length: 100 })
    thirdPartyTxnId?: string | null

    @Column({ nullable: true, type: Date })
    paidAt?: Date | null

    @Column({ nullable: true, type: Date })
    expireAt?: Date | null

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
