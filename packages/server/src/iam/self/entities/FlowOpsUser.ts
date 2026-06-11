import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity('flowops_user')
export class FlowOpsUser {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string

    @Column({ nullable: true, type: 'varchar', length: 255 })
    name?: string | null

    @Column({ nullable: true, type: 'text' })
    credential?: string | null

    @Column({ type: 'varchar', length: 20, default: 'invited' })
    status: string

    @Column({ nullable: true, type: 'text' })
    tempToken?: string | null

    @Column({ nullable: true, type: Date })
    tokenExpiry?: Date | null

    @Column({ nullable: true, type: Date })
    lastLogin?: Date | null

    @CreateDateColumn({ type: Date })
    createdDate?: Date

    @UpdateDateColumn({ type: Date })
    updatedDate?: Date
}
