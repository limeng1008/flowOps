import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('flowops_role')
export class FlowOpsRole {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 100, unique: true })
    name: string

    @Column({ nullable: true, type: 'text' })
    description?: string | null

    @Column({ type: 'text' })
    permissions: string

    @Column({ type: 'boolean', default: false })
    isBuiltin: boolean

    @CreateDateColumn({ type: Date })
    createdDate?: Date

    @UpdateDateColumn({ type: Date })
    updatedDate?: Date
}
