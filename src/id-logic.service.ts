import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DateTime } from 'luxon';
import { CreationAttributes } from 'sequelize';
import { IdLogicInterface } from './id-logic.interface';
import { SysGeneratedId } from './models/generated-id.model';
import { IdLogic } from './models/id-logic.model';

@Injectable()
export class IdLogicService {
  constructor(
    @InjectModel(IdLogic)
    private readonly logicModel: typeof IdLogic,
    @InjectModel(SysGeneratedId)
    private readonly generatedModel: typeof SysGeneratedId,
  ) {}

  async generateId(
    data: IdLogicInterface,
  ): Promise<string | string[]> {
    if (data.multiple && data.multiple > 0) {
      return this.generateIdMultiple(data);
    }

    const sequelize = this.logicModel.sequelize;
    if (!sequelize)
      throw new Error(
        'Sequelize instance not found',
      );

    const transaction =
      await sequelize.transaction();

    try {
      const logic = await this.logicModel.findOne(
        {
          where: {
            slug: data.slug,
            active: true,
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );

      if (!logic)
        throw new Error(
          `No ID logic found for slug "${data.slug}"`,
        );

      const now = data.date
        ? DateTime.fromISO(data.date)
        : DateTime.now();

      // ✅ Build token from all data fields + optional date logic
      const token = this.buildFullToken(
        logic.token_reset_logic,
        data.data,
        now,
      );

      // ✅ Find last generated sequence for this token
      const lastGenerated =
        await this.generatedModel.findOne({
          where: {
            slug: data.slug,
            id_token: token,
          },
          order: [['sequence_number', 'DESC']],
          transaction,
        });

      let nextNumber = logic.starting_id;

      if (lastGenerated) {
        const lastDate = DateTime.fromJSDate(
          lastGenerated.createdAt,
        );
        const shouldReset = this.shouldReset(
          logic,
          lastDate,
          now,
          token,
          lastGenerated.id_token,
        );
        nextNumber = shouldReset
          ? logic.starting_id
          : lastGenerated.sequence_number + 1;
      }

      // ✅ Build the formatted code
      let code = logic.format;
      code = this.replaceDatePlaceholders(
        code,
        now,
      );
      code = this.replaceDataPlaceholders(
        code,
        data.data,
      );

      const paddedNum = String(
        nextNumber,
      ).padStart(logic.pad_length, '0');
      code = code.replace(/\{#+\}/g, paddedNum);
      code = code
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');

      // ✅ Save generated ID
      await this.generatedModel.create(
        {
          slug: data.slug,
          id_token: token,
          generated_code: code,
          sequence_number: nextNumber,
        } as CreationAttributes<SysGeneratedId>,
        { transaction },
      );

      await transaction.commit();
      return code;
    } catch (err) {
      await transaction.rollback();
      console.error('Error generating ID:', err);
      throw err;
    }
  }

  private async generateIdMultiple(
    data: IdLogicInterface,
  ): Promise<string[]> {
    const count = data.multiple ?? 1;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(
        (await this.generateId({
          ...data,
          multiple: undefined,
        })) as string,
      );
    }
    return ids;
  }

  /**
   * Build id_token from all data fields + date-based logic if needed
   */
  private buildFullToken(
    tokenResetLogic: string | undefined,
    data: Record<string, any> | undefined,
    now: DateTime,
  ): string {
    const tokenParts: string[] = [];

    // Include all data fields
    if (data) {
      for (const [_, value] of Object.entries(
        data,
      )) {
        tokenParts.push(`${value}`);
      }
    }

    // Include time parts from token_reset_logic if defined
    if (tokenResetLogic) {
      const keys = tokenResetLogic.split(',');
      for (const key of keys) {
        switch (key) {
          case 'YYYY':
            tokenParts.push(now.toFormat('yyyy'));
            break;
          case 'YY':
            tokenParts.push(now.toFormat('yy'));
            break;
          case 'MM':
            tokenParts.push(now.toFormat('MM'));
            break;
          case 'DD':
            tokenParts.push(now.toFormat('dd'));
            break;
        }
      }
    }

    return tokenParts.join('-');
  }

  /**
   * Determine if the sequence should reset
   */
  private shouldReset(
    logic: IdLogic,
    lastDate: DateTime,
    now: DateTime,
    currentToken: string,
    lastToken: string,
  ): boolean {
    if (logic.reset_type === 'none') return false;
    if (logic.reset_type === 'yearly')
      return now.year !== lastDate.year;
    if (logic.reset_type === 'monthly')
      return (
        now.year !== lastDate.year ||
        now.month !== lastDate.month
      );
    if (logic.reset_type === 'daily')
      return !now.hasSame(lastDate, 'day');
    // Token-based reset
    return currentToken !== lastToken;
  }

  private replaceDatePlaceholders(
    format: string,
    now: DateTime,
  ): string {
    return format
      .replace(/\{YYYY\}/g, now.toFormat('yyyy'))
      .replace(/\{YY\}/g, now.toFormat('yy'))
      .replace(/\{MM\}/g, now.toFormat('MM'))
      .replace(/\{DD\}/g, now.toFormat('dd'));
  }

  private replaceDataPlaceholders(
    format: string,
    data: Record<string, any> | undefined,
  ): string {
    if (!data) return format;
    for (const [key, value] of Object.entries(
      data,
    )) {
      format = format.replace(
        new RegExp(`\\{${key}\\}`, 'g'),
        value ?? '',
      );
    }
    return format;
  }
}
