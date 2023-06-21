import { getGettextBuilder } from '@nextcloud/l10n/gettext'

const gtBuilder = getGettextBuilder()
	.detectLocale()

__TRANSLATIONS__.map(data => gtBuilder.addTranslation(data.locale, data.json))

const gt = gtBuilder.build()

export const n = gt.ngettext.bind(gt)
export const t = gt.gettext.bind(gt)
