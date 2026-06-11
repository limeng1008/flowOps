import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Index(['workspaceId', 'userId'], { unique: true })
@Entity('flowops_workspace_member')
export class FlowOpsWorkspaceMember {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ type: 'text' })
    workspaceId: string

    @Index()
    @Column({ type: 'text' })
    userId: string

    @Index()
    @Column({ type: 'text' })
    roleId: string

    @CreateDateColumn({ type: Date })
    createdDate?: Date

    @UpdateDateColumn({ type: Date })
    updatedDate?: Date
}
