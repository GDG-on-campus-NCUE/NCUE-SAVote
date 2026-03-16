import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ElectionType } from '@savote/shared-types';

export class CreateElectionDto {
  @IsString()
  @IsNotEmpty({ message: '選舉名稱不得為空' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ElectionType, { message: '必須選擇有效的選舉種類' })
  type: ElectionType;

  @IsOptional()
  @IsObject()
  config?: any;

  // @IsOptional()
  // @IsString()
  // merkleRootHash?: string;

  @IsDateString({}, { message: '開始時間必須是有效的日期格式' })
  @IsNotEmpty({ message: '必須設定開始投票時間' })
  startTime: string;

  @IsDateString({}, { message: '結束時間必須是有效的日期格式' })
  @IsNotEmpty({ message: '必須設定結束投票時間' })
  endTime: string;
}
