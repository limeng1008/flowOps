import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class BillingPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 50, unique: true })
    code: string

    @Column({ type: 'varchar', length: 100 })
    name: string

    @Column({ nullable: true, type: 'text' })
    description?: string | null

    @Column({ nullable: false, type: 'text' })
    quotas: string

    @Column({ type: 'varchar', length: 32, default: 'free' })
    entitlementTier: string

    @Column({ type: 'int', default: 0 })
    monthlyPriceCents: number

    @Column({ type: 'varchar', length: 10, default: 'CNY' })
    currency: string

    @Column({ nullable: true, default: true })
    isActive?: boolean

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
