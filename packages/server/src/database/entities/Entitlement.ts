import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
@Index(['scopeId'], { unique: true })
export class Entitlement {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ nullable: false, type: 'text' })
    scopeId: string

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 32, default: 'free' })
    tier: string

    @Column({ nullable: false, type: 'int', default: 1 })
    seats: number

    @Column({ nullable: false, type: 'int', default: 0 })
    creditsTotal: number

    @Index()
    @Column({ nullable: false, type: 'int', default: 0 })
    creditsBalance: number

    @Column({ nullable: false, type: 'text' })
    features: string

    @Column({ nullable: false, type: 'int', default: 1 })
    concurrency: number

    @Column({ nullable: true, type: 'datetime' })
    expireAt?: Date | null

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 32, default: 'local' })
    source: string

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
