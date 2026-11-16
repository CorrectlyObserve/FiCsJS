import { paths } from '@/domain/path'

export default { [paths.USER]: paths.HOME, [`${paths.WS_SSE}*`]: paths.WS_SSE }
