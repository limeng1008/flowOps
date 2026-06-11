import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('flowops_workspace')
export class FlowOpsWorkspace {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255 })
    name: string

    @Column({ nullable: true, type: 'text' })
    description?: string | null

    @Index()
    @Column({ type: 'text' })
    organizationId: string

    @CreateDateColumn({ type: Date })
    createdDate?: Date

    @UpdateDateColumn({ type: Date })
    updatedDate?: Date
}
