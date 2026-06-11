import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class SupportTicket {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Index()
    @Column({ nullable: false, type: 'text' })
    organizationId: string

    @Index()
    @Column({ nullable: true, type: 'text' })
    workspaceId?: string | null

    @Index()
    @Column({ nullable: false, type: 'text' })
    requesterUserId: string

    @Column({ nullable: false, type: 'varchar', length: 255 })
    requesterEmail: string

    @Column({ nullable: true, type: 'varchar', length: 255 })
    requesterName?: string | null

    @Column({ nullable: true, type: 'varchar', length: 255 })
    assignedToEmail?: string | null

    @Column({ nullable: false, type: 'varchar', length: 200 })
    subject: string

    @Column({ nullable: true, type: 'varchar', length: 50 })
    category?: string | null

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 20 })
    status: string

    @Index()
    @Column({ nullable: false, type: 'varchar', length: 20 })
    priority: string

    @Column({ nullable: false, type: 'text' })
    messages: string

    @Column({ nullable: true, type: 'text' })
    lastMessage?: string | null

    @Column({ nullable: true, type: 'varchar', length: 20 })
    lastMessageBy?: string | null

    @Column({ nullable: true, type: Date })
    resolvedDate?: Date | null

    @Column({ nullable: true, type: Date })
    closedDate?: Date | null

    @CreateDateColumn()
    createdDate?: Date

    @UpdateDateColumn()
    updatedDate?: Date
}
