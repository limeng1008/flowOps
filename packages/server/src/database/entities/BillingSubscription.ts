import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum BillingSubscriptionStatus {
    ACTIVE = 'active',
    CANCELED = 'canceled',
    EXPIRED = 'expired'
}

@Entity()
export class BillingSubscription {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: false, type: 'text' })
    organizationId: string

    @Column({ nullable: false, type: 'text' })
    planId: string

    @Column({ type: 'varchar', length: 20, default: BillingSubscriptionStatus.ACTIVE })
    status: string

    @Column({ nullable: true })
    currentPeriodStart?: Date

    @Column({ nullable: true })
    currentPeriodEnd?: Date

    @Column({ nullable: true, type: 'text' })
    quotaOverrides?: string | null

    @Column({ nullable: true, type: 'text' })
    notes?: string | null

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
