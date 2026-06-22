import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

@Entity('flowops_audit_log')
export class FlowOpsAuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @CreateDateColumn({ type: Date })
    createdDate: Date

    @Index()
    @Column({ nullable: true, type: 'varchar', length: 255 })
    actorUserId?: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    actorEmail?: string | null

    @Index()
    @Column({ type: 'varchar', length: 100 })
    action: string

    @Column({ type: 'varchar', length: 100 })
    targetType: string

    @Column({ nullable: true, type: 'varchar', length: 255 })
    targetId?: string | null

    @Column({ nullable: true, type: 'text' })
    targetName?: string | null

    @Index()
    @Column({ nullable: true, type: 'varchar', length: 255 })
    organizationId?: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    workspaceId?: string | null

    @Column({ type: 'varchar', length: 20 })
    status: 'success' | 'failure'

    @Column({ nullable: true, type: 'varchar', length: 100 })
    ip?: string | null

    @Column({ nullable: true, type: 'text' })
    userAgent?: string | null

    @Column({ type: 'text', default: '{}' })
    metadata: string
}
