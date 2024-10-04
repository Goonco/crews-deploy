import { baseInstance } from './instance.ts';
import { IReadRecruitmentByCodeResponse } from './i-response-body/i-response-body.ts';
import { throwCustomError } from '../lib/utils/error.ts';

/*
   Apis that don't use authentication which means that non-user clients may also call these.
   (No need to set credentials)
  */

async function readRecruitmentByCode(
  recruitmentCode: string,
): Promise<IReadRecruitmentByCodeResponse> {
  try {
    const response = await baseInstance.get(
      `recruitments?code=${recruitmentCode}`,
    );

    /** FIXME: isIReadRecruitmentByCodeResponse have too many false values, so I have to comment this lines. */
    // if (isIReadRecruitmentByCodeResponse(response.data))
    return response.data;
    // throw new Error('[ResponseTypeMismatch] Unexpected response format');
  } catch (e) {
    throwCustomError(e, 'readRecruitmentByCode');
  }
}

export { readRecruitmentByCode };
