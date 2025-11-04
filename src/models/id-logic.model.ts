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
  tableName: 'sys_unique_id_logics',
  timestamps: true, // Enable automatic timestamps
})
export class IdLogic extends Model<IdLogic> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    allowNull: false,
    unique: true,
  })
  id: number;

  @Column({ type: DataType.STRING })
  slug: string;

  @Column({ type: DataType.STRING })
  format: string; // e.g., "{YYYY}-{MM}-{ID}" where {ID} is the padded sequence

  @Column({
    type: DataType.STRING,
    defaultValue: 'none',
  })
  reset_type: string; // 'none', 'yearly', 'monthly', 'daily', or custom token-based

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  token_reset_logic?: string; // Comma-separated, e.g., "YYYY,MM" for resets

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  next_number: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
  })
  starting_id: number; // Maps to old 'starting_id'

  @Column({
    type: DataType.INTEGER,
    defaultValue: 5,
  })
  pad_length: number; // Maps to old 'id_length'

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  active: boolean;

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
