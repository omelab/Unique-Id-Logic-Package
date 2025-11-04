import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'sys_generated_ids',
  timestamps: true, // Enable automatic timestamps
})
export class SysGeneratedId extends Model<SysGeneratedId> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    unique: true,
  })
  id: number;

  @Column(DataType.STRING)
  slug: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  id_token: string; // For token-based grouping/resets

  @Column({ type: DataType.STRING })
  generated_code: string; // The final formatted ID

  @Column({ type: DataType.INTEGER })
  sequence_number: number; // The sequential ID

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'created_at',
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'updated_at',
  })
  updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'deleted_at',
  })
  deletedAt?: Date;
}
