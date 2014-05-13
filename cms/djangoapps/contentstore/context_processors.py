import ConfigParser
from locale import getlocale
from django.conf import settings

config_file = open(settings.REPO_ROOT / "docs" / "config.ini")
config = ConfigParser.ConfigParser()
config.readfp(config_file)


def doc_url(request=None):

    def get_online_help_info(page_token):

        def get_config_value(section_name, key, default_key="default"):
            try:
                return config.get(section_name, key)
            except (ConfigParser.NoOptionError, AttributeError):
                return config.get(section_name, default_key)

        def get_page_path(page_token):
            return get_config_value("pages", page_token)

        def get_langage_path(request):
            language_code = settings.LANGUAGE_CODE
            return get_config_value("locales", language_code)

        def get_doc_url():
            return "{url_base}/{language}/{version}/{page_path}".format(
                url_base=config.get("help_settings", "url_base"),
                language=language_dir,
                version=config.get("help_settings", "version"),
                page_path=page_path,
            )

        def get_pdf_url():
            return "{pdf_base}/{version}/{pdf_file}".format(
                pdf_base=config.get("pdf_settings", "pdf_base"),
                version=config.get("help_settings", "version"),
                pdf_file=config.get("pdf_settings", "pdf_file"),
            )

        language_dir = get_langage_path(request)
        page_path = get_page_path(page_token)

        return {
            "doc_url": get_doc_url(),
            "pdf_url": get_pdf_url(),
        }

    return {'get_online_help_info': get_online_help_info}
