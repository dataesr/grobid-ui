# How to build an Open Science Monitor based on publications? A French perspective

**Authors:** Laetitia Bracco, Eric Jeangirard, Anne L'hôte, Laurent Romary

## Abstract

Many countries and institutions are striving to develop tools to monitor their open science policies.Since 2018, with the launch of its National Plan for Open Science, France has been progressively implementing a monitoring framework for its public policy, relying exclusively on reliable, open, and controlled data.Currently, this monitoring focuses on research outputs, particularly publications, as well as theses and clinical trials.Publications serve as a basis for analyzing other dimensions, including research data, code, and software.The metadata associated with publications is therefore particularly valuable, but the methodology for leveraging it raises several challenges.Here, we briefly outline how we have used this metadata to construct the French Open Science Monitor.

**Date:** 2024-12

The starting point for these analyses is a corpus of publications.Defining the appropriate target scope is essential to provide relevant insights.Details about the metadata required for this corpus are provided in Section 2. In summary, describing this corpus with a PID (Persistent Identifier) and associated metadata is crucial.The default primary PID should be the Crossref DOI.Other PIDs can be used, but the methodology and code must be adapted accordingly, particularly for Open Access (OA) status discovery.

Additional metadata are also required.A normalized scientific field classification enables the creation of KPIs by scientific domain.If such metadata are unavailable, they can be inferred using machine learning models.OpenAlex also provides computed metadata that can be leveraged.Metadata such as publishers, repositories, journals, affiliations, and publication types can support further analyses, but they must be normalized to ensure that the insights derived are meaningful.

Depending on the context, the corpus can be extracted from CRIS systems, global databases (such as OpenAlex), or even custom-built.The French Open Science Monitor (OSM) opted for the latter approach, combining open data from Crossref, PubMed, open repositories, web crawling, and bottom-up data contributions from French institutions that wish to develop their own OSM.For global data sources, country affiliation is determined based on harvested (or crawled) raw affiliation strings using the affiliation matcher detailed in (L'Hôte and Jeangirard 2021).The code and a Docker image are available here: https://github.com/dataesr/affiliation-matcherhttps://github.com/dataesr/affiliation-matcher.

For Open Access publication KPIs, an OA status discovery tool is required.By default, Unpaywall provides information for Crossref DOIs.

For indicators related to datasets and software, in addition to the metadata corpus, the full texts of publications in PDF format are also required.Text and Data Mining (TDM) techniques can then be applied to compute the KPIs.

Warning: To achieve the best possible results, it is essential to download as many full-text publications as possible.In the European context, this is feasible under the framework of the European directive allowing text and data mining for research purposesfoot_0foot_0 .It is necessary to have lawful access to the downloaded content if it is not already openly accessible, for instance, via a subscription.Outside the European Union, the legal framework must be carefully reviewed.This note does not address the context beyond Europe.

## Open source software used

The French Monitor code is freely available under open license (MIT License).It is modular as detailed in the infrastructure section in [(Bracco et al. 2022](Bracco et al. 2022) (for OA to publications) and in [(Bassinet et al. 2023](Bassinet et al. 2023) (for datasets and software).However, it is closely linked to our data acquisition pipeline (web crawling, bottom data collection from French institutions, extension to cover French specific PID (HAL)) and to the data architecture we built on the OVH public cloud -S3 Object Storage used by the Ministry.Also, Python has been used.If it is to be implemented in another country, parts of the code will have to be rewritten to match the local requirements.The core monitor code also relies on other free and open source services / software:

• Open access discovery tool (as explained above): Unpaywall The premium service of Unpaywall is used to get a quarterly full snapshot of the database.These snapshots are used to historicize the OA status of each publication, useful to analyse the OA dynamics.

• A Text and Data Mining (TDM) tool to detect research datasets mentions from the full-text.We use DataStet from the Docker image 0.8.0

• A Text and Data Mining (TDM) tool to detect code and software mentions from the full-text.We use Softcite from the Docker image 0.8.0

• A smart scholarly PDF parsing tool to structure metadata and the full-text content from a PDF.

We use GROBID from the Docker image 0.8.0.Later versions (from 0.8.1) include fixes on grant ids detection that can be very relevant.

We also developed extra modules that glues together and orchestrates all the previous tools:

• The module bso3-analyse-publications implements in Python the whole TDM pipeline, and also the analysis funnel analysis at the document level of the resulting outputs to get publication-wise KPIs.

• The module bso-publications implements in python an extract-transform-load process and stores the final results, at the publication level, in an Elasticsearch index.

## Computation power consumed

We deploy our code on a public cloud infrastructure, by OVH.We use their managed Kubernetes service, using multiple nodes (servers):

• 1 large server (16 CPU 240Go RAM) is used to host the metadata Mongo databases (Unpaywall snapshots, French corpus metadata) and run most of the OA KPIs calculations.

• 6 smaller servers are used for data acquisition (crawling, parsing, harvesting) and enrichment (language detection, discipline inference, tasks monitoring . . . ) (4 CPU 15Go RAM and 2 CPU 7Go RAM).

• 1 medium server (4 CPU 60Go RAM) used to harvest the PDF.

• 5 servers (32 CPU 120Go RAM) to run the TDM analysis.

• 3 servers (with redundancy) (16 CPU 60Go RAM) to host the Elasticsearch indices.

• 6 servers (with redundancy + staging/prod) (2 CPU 7Go) to host the website.

This infrastructure is also used for other projects, so 100% cannot be affected to the OS monitoring (in particular the Elasticsearch and websites hosting part).However, the PDF harvesting and TDM analysis are a very specific need.For this specific need, around 20k euros were spent to analyse 700k PDFs in one month.The rest of the infrastructure is around 70k a year, but is not specific to OS monitoring.Relying on other services (like OpenAlex) could help reduce the costs.

## Team and human resources

A deep understanding of the Open science / scholarly communications area is key to make it happen.Random software engineers do not have this knowledge and it may take time for them to understand what is at stake for the monitoring to be relevant.Building the whole pipeline can be implemented with about 2 FTE for 6 months.An extra FTE (project manager or so) can be needed to make sure software developments are inline with the project goals.Maintenance costs are lower, about 0.5 FTE a year.However, things evoles fast and new features (new objects to monitor, new types of analysis . . . ) are generally necessary so a maintenance only scenario is not very likely to happen.

## A few methodological considerations 2.1 Corpus creation

## Defining a perimeter

Research outputs can be indexed in large databases (Crossref, Datacite, OpenAlex), or not.It can be necessary to put in place specific harvesters to get metadata from other places (disciplinary or institutional repositories for example).

Making sure these extra data are correctly ingested with the data coming from the large database is a challenge (data format, no duplicates . . .).An option could be to make those extra research outputs fit into one of these databases: adding DOI for example, or asking OpenAlex to harvest extra repositories.

Also, about the distinction between types of publication, for example, the distinction with professional articles: it all depends on the available data, of course, but also the main point to define the perimeter is to know upfront what is the goal of the monitoring.If it is to steer and analyze the impact of a public policy, then the perimeter has to be in line with the public policy itself.That may be different from one national/institutional situation to another.That is also why, in France, we propose a national monitoring, but also "local" monitoring in which the perimeter can be customed by the users.

OpenAlex now) already implements that logic, at least for all Crossref DOI.For other publications (with no Crossref DOI), open access discovery is not that easy and depends on local specificities.In the future, we could expect that, if those publications are in OpenAlex, they also benefit from a better open access discovery service just like with Unpaywall.Also, it is important to note that the open access status is not a fixed metadata (contrary to the title or the list of authors for instance).It can evolve over time.More details on this aspect are given in [(Bracco et al. 2022)](Bracco et al. 2022).

## Open Access types

In the French Open Science Monitor, we analyze in different ways the type of open access.In particular,

• is it opened via the publisher or via a repository (or both?) -regardless of the license

• if it is opened via the publisher, what kind of business model is it used?

• if it is opened via the publisher, is there any proper license, and which one?

More details are described in [(Bracco et al. 2022](Bracco et al. 2022).

## APC estimation

Estimating Article Processing Charge (APC) is not an easy task.In the French OSM, we implemented an article level estimation, based on the data from DOAJ and OpenAPC (cf [(Bracco et al. 2022)](Bracco et al. 2022)).

In particular, if an article, not present in OpenAPC, is published in a journal that is sufficiently represented in OpenAPC (for the same year of publication), an APC amount is estimated based on the average APC paid for articles published in that journal in the same year.OpenAlex provides also some insights, based in particular on listed APC.However, two main difficulties are difficult to overcome.First, when an article is in collaboration, it is very difficult to know which institution has actually paid.The institution of the corresponding author is probably a good guess, but the corresponding author metadata is hard to get.Another difficulty comes from the transformative agreements, where APC are negotiated at a larger scale.The marginal APC per article is then harder to estimate.

## Dataset and software mention detection

Research datasets, software and code are research outputs difficult to monitor.We explored a very generic technique to analyse those objects: this technique can be applied to any country and discipline, as long as a publication corpus is available.Publications' full-texts are analyzed with deep learning models to detect all the mentions of data / datasets, and also all the mentions of software and code.Those mentions are then caracterized in context, that means they are classified according to the type of mention.In the model we use, each mention can be a mention of usage, creation, or sharing.Once all the mentions detected are caracterized, document-level indicators are computed, to calculate whether a publication does use / create / share data or software.Eventually, the French OSM computes national-level indiators, with the percentage of publication that mentions sharing data (/ software) amongst the publications that indicates using and producing data (/ software), see [(Bassinet et al. 2023)](Bassinet et al. 2023).

The detection models (Softcite and Datastet) can be improved for sure.The works-magnet https://works- magnet.esr.gouv.fr/https://works- magnet.esr.gouv.fr/provides a module to explore and correct the mentions detected in the French corpus.We hope to collect enough good quality curated data to build an extended training dataset and then more accurate machine learning models for dataset and software detection.We are convinced setting in place quick human feedback loop with increase the accuracy of the detection models.Works-magnet like tools enable that kind of interactions and could be integrated in different pipelines, like on manuscript deposit platforms.

## A few advices and impact

Having an objective and quantitative tool for monitoring, easy to plug, which makes it easier for funders and institutions to communicate and steer their open science policy.Having a tool that can be easily adapted to different contexts like funders or institutions is then a key component.However, a tool remains a tool and is only complementary to the local policies and mandates.

Some tips also can help in building a reliable and effective Open Science Monitoring.

• Clean up OpenAlex affiliations to obtain a reliable corpus of publications (the works-magnet can help).

• Maintaining its own infrastructure is costly (money and HR).A call to open infrastructure could help reduce the costs and invest in a shared infrastructure / methodology.

• If a national dashboard cannot be created, it is already possible to obtain useful indicators on open access publications directly via COKI (see (Diprose 2023)), as it is based on OpenAlex data.• In the event of legal and/or economic difficulties in accessing non-open access content, a downgraded version of the result based solely on open access full text and under CC licence is possible.

## References

1. Bassinet A., Bracco L., Hôte A., Jeangirard E., Lopez P., Romary L., *Large-scale Machine-Learning analysis of scientific PDF for monitoring the production and the openness of research data and software in France*, 2023
2. Bracco L., 'hôte A., Jeangirard E., Torny D., *Extending the open monitoring of open science*, 2022
3. Diprose J., Hosking R., Rigoni R., Roelofs A., Chien T., Napier K., Wilson K., Huang C., Handcock R., Montgomery L., Neylon C., "A User-Friendly Dashboard for Tracking Global Open Access Performance", *The Journal of Electronic Publishing*, vol. 26, no. 1, 2023-05-10
4. Jeangirard E., "Monitoring Open Access at a national level: French case study", *ELPUB 2019 23d International Conference on Electronic Publishing*, 1920
5. Jeangirard E., Bracco L., Hôte A., "Works-magnet : aucune de perdue, 10 000 de retrouvées", *Abes; Journées Abes 2024*, 2024
6. Jeangirard É., "L'utilisation de l'apprentissage automatique dans le Baromètre de la science ouverte : une façon de réconcilier bibliométrie et science ouverte ?", *Arabesques*, no. 107, pp. 10-11, 2022-09
7. L'hôte A., Jeangirard E., *Using Elasticsearch for entity recognition in affiliation disambiguation*, 2021
