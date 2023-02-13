# Gene Graphics
---

Viewing and comparing gene neighborhoods is a common step in comparative genomics and gene analysis. We present, “Gene Graphics”, an application that allows for consistent, visually appealing representations of physical gene neighborhoods with minimal effort or expertise.

Given a standard input file, “Gene Graphics” generates a default layout that is designed to be immediately usable. Within the graphical interface, users can customize colors, fonts, sizes, and positions of gene names, both individually and globally.

In 2023, Gene Graphics was rewritten and upgraded to Angular 15.

#### New Features:
- Users can now select multiple features or regions and save selection groups.
- Multiple GeneGraphics can be created, managed and saved within the application.
- A set of identifiers parsed from the source file may be applied as feature or region names.
- Lines may be added to regions.
- Features can be individually represented by arrows, tags and bars.
- Regions and features can be deleted.
- Regions can be moved up and down in the GeneGraphic.
- Features may have two colors to represent a fusion between domains.
- Faster rendering, loading and exporting.

#### Input
Supported input files include:
- TSV files from Seed
- TSV files from [GizmoGene.com](http://www.gizmogene.com/)
- Legacy save TSV files from V1 of Gene Graphics
- Genbank files that include only one species

Users may also fetch regions from NCBI within the application.

#### Browser storage
Gene Graphics v2 uses IndexedDB to store Gene Graphics data in the user's browser. The user may export the entire database or a single Gene Graphic, to be uploaded on another device. 

#### Dockerizable
Gene Graphics is now designed to be deployed with docker. Example docker-compose files are included in this repository, along with an example .env file. 

### Citation

**Gene Graphics: a genomic neighborhood data visualization web application.**  
Harrison KJ, de Crécy-Lagard V, Zallot R.
Bioinformatics. Published 2017 Dec 7. doi: 10.1093/bioinformatics/btx793. [Epub ahead of print]  
PMID: 29228171

### Hosted Tool
GeneGraphics v2 is now hosted on https://v2.genegraphics.net and will replace v1 at https://www.genegraphics.net in the future
