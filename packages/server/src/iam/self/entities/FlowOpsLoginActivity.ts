import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('flowops_login_activity')
export class FlowOpsLoginActivity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: true, type: 'text' })
    userId?: string | null

    @Index()
    @Column({ type: 'varchar', length: 50 })
    activityCode: string

    @Column({ nullable: true, type: 'varchar', length: 100 })
    ip?: string | null

    @Column({ nullable: true, type: 'text' })
    message?: string | null

    @CreateDateColumn({ type: Date })
    createdDate?: Date

    @UpdateDateColumn({ type: Date })
    updatedDate?: Date
}
