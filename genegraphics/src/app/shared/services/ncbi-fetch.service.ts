import { Injectable } from '@angular/core';
import { createId } from '@paralleldrive/cuid2';
import { Papa, ParseConfig } from 'ngx-papaparse';
import { NCBIGenome, DataFetch } from '@models/models';
import { DatabaseService } from '@services/database.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { interval, Observable, of } from 'rxjs';
import { concatMap, filter, map, switchMap, timeout } from 'rxjs/operators';
import { XMLParser } from 'fast-xml-parser';

export interface IDFetchResponse {
  fetchID: string;
  start: number;
  stop: number;
}

@Injectable({
  providedIn: 'root',
})
export class NcbiFetchService {
  constructor(
    private db: DatabaseService,
    private papa: Papa,
    private http: HttpClient
  ) {}

  process_location(location_string: string) {
    let index,
      newlocation = '',
      segment = { start: '', end: '' },
      segs = [],
      i,
      segments = [];
    location_string = location_string.replace(/<|>/g, '');
    if (/[0-9]/g.test(location_string.slice(0, 1))) {
      const loc_matches = location_string.match(/(\d+)\.\.(\d+)/);
      if (loc_matches != null) {
        segment.start = loc_matches[1];
        segment.end = loc_matches[2];
        segments[0] = segment;
        return segments;
      } else {
        const loc2_matches = location_string.match(/(\d+)/);
        if (loc2_matches) {
          segment.start = loc2_matches[1];
          segment.end = loc2_matches[1];
          segments[0] = segment;
          return segments;
        }
      }
    }
    while (location_string.match(/complement|join/g)) {
      if (/[0-9]/g.test(location_string.slice(0, 1))) {
        const match_loc = /j|c/.exec(location_string);
        if (match_loc) {
          newlocation = location_string.slice(0, match_loc.index - 1);
          location_string = location_string.slice(index);
        }
      } else if (/complement/.test(location_string.slice(0, 10))) {
        location_string = location_string.replace(/(\d+)\.\.(\d+)/g, '$2..$1');
        location_string = location_string.slice(11, -1);
      } else if (/join/.test(location_string.slice(0, 4))) {
        location_string = location_string.slice(5, -1);
      }
    }
    newlocation += location_string;
    if (/,/g.test(newlocation)) {
      segs = newlocation.split(/,/);
    } else {
      segs[0] = newlocation;
    }
    for (i = 0; i < segs.length; i += 1) {
      segment.start = '';
      segment.end = '';
      let matches = segs[i].match(/(\d+)\.\.(\d+)/);
      if (matches) {
        segment.start = matches[1];
        segment.end = matches[2];
      }
      segments.push(segment);
    }
    return segments;
  }

  readGBLocation(lines: string[]) {
    let i = 0,
      j,
      textline,
      obj: { [key: string]: any } = {};
    while (i < lines.length) {
      if ('DEFINITION' === lines[i].slice(0, 10)) {
        if (/^MULTISPECIES:/g.test(lines[i].slice(10).trim())) {
          throw new Error('Invalid filetype: multispecies');
        }
      } else if ('DBSOURCE' === lines[i].slice(0, 8)) {
        var re = /[A-Z]+[_]?[A-Z]*[\d]+[\.]?[\d]?/;
        var db_matches = lines[i].match(re);
        obj['nuccsource'] = db_matches ? db_matches[0] : null;
        j = i + 1;
        while (typeof lines[j] !== 'undefined') {
          textline = lines[j].trim().slice(1);
          var linematches = textline.match(/([\w|\W]*)=([\w|\W]*)/);
          if (linematches != null && linematches[1] == 'coded_by') {
            obj['sourceloc'] = this.process_location(
              linematches[2].replace(/\"/g, '')
            );
            return obj;
          }
          j++;
        }
        return obj;
      }
      i++;
    }
    return obj;
  }

  parseGeneGenomeSearch(text: string): Observable<string> {
    const parser = new XMLParser();
    let data = parser.parse(text);
    const fetchId = data.eSearchResult.IdList.Id;
    if (!fetchId) throw new Error('No results found from search.');
    return of(data.eSearchResult.IdList.Id);
  }

  parseUniprotJobID(responseObj: any): Observable<string> {
    if (!responseObj.jobId)
      throw new Error('Could not post job to Uniprot API');
    return of(responseObj.jobId);
  }

  uniprotJobRequest(term: string): Observable<any> {
    const postURL = 'https://rest.uniprot.org/idmapping/run';
    let formData = new FormData();
    formData.append('ids', term);
    formData.append('from', 'UniProtKB_AC-ID');
    formData.append('to', 'GeneID');
    return this.http.post(postURL, formData);
  }

  pollUniprotJobResults(jobId: string): Observable<string> {
    const pollURL = 'https://rest.uniprot.org/idmapping/status/' + jobId;
    const job$ = this.http.get(pollURL, { responseType: 'json' });
    return interval(2000)
      .pipe(
        switchMap((_) => job$),
        filter((data: any) => {
          return data.results;
        }),
        timeout(30000)
      )
      .pipe(
        map((results) => {
          let id = results.results[0].to;
          if (!id) throw new Error('Could not get results from job');
          return id;
        })
      );
  }

  ncbiSearch(searchTerm: string, searchDB: string): Observable<string> {
    const fetchURL =
      'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=' +
      searchDB +
      '&term=' +
      searchTerm;
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.get(fetchURL, { headers, responseType: 'text' });
  }

  ncbiFetch(
    fetchID: string,
    fetchDB: string,
    retMode: string,
    retType?: string,
    seqArr?: [number, number]
  ): Observable<string> {
    let fetchURL = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=${fetchDB}&id=${fetchID}&retmode=${retMode}`;
    if (retType) fetchURL += `&retType=${retType}`;
    if (seqArr) fetchURL += `&seq_start=${seqArr[0]}&seq_stop=${seqArr[1]}`;
    const headers = new HttpHeaders().set(
      'Content-Type',
      'text/plain; charset=utf-8'
    );
    return this.http.get(fetchURL, { headers, responseType: 'text' });
  }

  parseGeneIDFetchResponse(
    text: string,
    seqRange: number
  ): Observable<IDFetchResponse> {
    const re_err = /Error.+/gi;
    const err_match = re_err.exec(text);
    if (err_match != null) throw new Error('The ID could not be found.');
    const re_listnum = /\d\. .+/g;
    const items = text.match(re_listnum);
    if (items != null && items.length != 1)
      throw new Error('A unique ID was not found.');
    const re =
      /(?:Annotation:[\s]*)(?:Chromosome [\d|A-Z]+ )?([A-Z\_\d\.]+)[\s]*\(([\d]*)\.{2}([\d]*)(?:, complement\)|\))/gi;
    const annotations = re.exec(text);
    if (!annotations) throw new Error('The ID could not be found.');
    if (re.exec(text)) throw new Error('A unique ID was not found.');
    const fetchID = annotations[1];
    const start = parseInt(annotations[2]);
    const stop = parseInt(annotations[3]);
    const mid = Math.floor((stop + start) / 2);
    const seqRangeStart = mid - Math.floor(seqRange / 2);
    const seqRangeEnd = mid + Math.ceil(seqRange / 2);
    return of({
      fetchID: fetchID,
      start: Math.round(seqRangeStart),
      stop: Math.round(seqRangeEnd),
    } as IDFetchResponse);
  }

  parseProteinIDFetchResponse(
    text: string,
    seqRange: number
  ): Observable<IDFetchResponse> {
    const lines = text.match(/[^\r\n]+/g);
    if (!lines) throw new Error('Could not Parse GB File');
    const gbloc = this.readGBLocation(lines);
    const nuccsource = gbloc['nuccsource'];
    let start = parseInt(gbloc['sourceloc'][0]['start']);
    let end = parseInt(gbloc['sourceloc'][0]['end']);
    if (!nuccsource || !start || !stop)
      throw new Error('No source genome found');
    const region_flank = seqRange / 2;
    const gene_midpoint = (start + end) / 2;
    if (start < region_flank) {
      start = 0;
      end = region_flank;
    } else {
      start = gene_midpoint - region_flank;
      end = gene_midpoint + region_flank;
    }
    return of({
      fetchID: nuccsource,
      start: Math.round(start),
      stop: Math.round(end),
    });
  }

  getGBFile(searchType: string, term: string, seqArr: [number, number]) {
    if (searchType === 'Gene ID') {
      return this.ncbiFetch(term, 'gene', 'text').pipe(
        concatMap((response) =>
          this.parseGeneIDFetchResponse(response, seqArr[1])
        ),
        concatMap((parsed) =>
          this.ncbiFetch(parsed.fetchID, 'nuccore', 'text', 'gbwithparts', [
            parsed.start,
            parsed.stop,
          ])
        )
      );
    } else if (searchType === 'Protein ID') {
      return this.ncbiFetch(term, 'protein', 'text', 'gp').pipe(
        concatMap((gbText) =>
          this.parseProteinIDFetchResponse(gbText, seqArr[1])
        ),
        concatMap((parsed) =>
          this.ncbiFetch(parsed.fetchID, 'nuccore', 'text', 'gbwithparts', [
            parsed.start,
            parsed.stop,
          ])
        )
      );
    } else if (searchType === 'Gene Symbol and Genome') {
      return this.ncbiSearch(term, 'gene').pipe(
        concatMap((response) => this.parseGeneGenomeSearch(response)),
        concatMap((fetchID) => this.ncbiFetch(fetchID, 'gene', 'text')),
        concatMap((response) =>
          this.parseGeneIDFetchResponse(response, seqArr[1])
        ),
        concatMap((parsed) =>
          this.ncbiFetch(parsed.fetchID, 'nuccore', 'text', 'gbwithparts', [
            parsed.start,
            parsed.stop,
          ])
        )
      );
    } else if (searchType === 'Genome Region') {
      return this.ncbiFetch(term, 'nuccore', 'text', 'gbwithparts', seqArr);
    } else if (searchType === 'UniprotKB Accession') {
      return this.uniprotJobRequest(term).pipe(
        concatMap((response) => this.parseUniprotJobID(response)),
        concatMap((jobId) => this.pollUniprotJobResults(jobId)),
        concatMap((gbId) => this.ncbiFetch(gbId, 'gene', 'text')),
        concatMap((response) =>
          this.parseGeneIDFetchResponse(response, seqArr[1])
        ),
        concatMap((parsed) =>
          this.ncbiFetch(parsed.fetchID, 'nuccore', 'text', 'gbwithparts', [
            parsed.start,
            parsed.stop,
          ])
        )
      );
    } else {
      throw new Error('Something went wrong');
    }
  }

  async fetchNcbiGenomes(clearOld: boolean) {
    const urls = [
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Bacteria.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Eukaryota.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Archaea.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Mito_metazoa.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Phages.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/Plasmids.ids',
      'https://ftp.ncbi.nih.gov/genomes/GENOME_REPORTS/IDS/dsDNA_Viruses.ids',
    ];
    const newDataFetch: DataFetch = {
      id: createId(),
      last_fetch: 0,
      error: [] as string[],
      data: [] as NCBIGenome[],
    };
    const options: ParseConfig = {
      delimiter: '\t',
      download: true,
      chunk: (result) => {
        result.data.forEach((cols: string[]) => {
          let organism = cols.length === 7 ? cols[5] + ' ' + cols[6] : cols[5];
          let ncbiGenome: NCBIGenome = {
            id: createId(),
            organism: organism,
            refseqId: cols[1],
            gbId: cols[4],
          };
          newDataFetch.data.push(ncbiGenome);
        });
        this.db.dataFetches.put(newDataFetch);
      },
      complete: () => {
        newDataFetch.last_fetch = Date.now();
        this.db.dataFetches.put(newDataFetch);
        if (clearOld) {
          this.db.dataFetches.toArray().then((arr) => {
            if (arr.length > 1) {
              let old = arr.reduce((oldest, data) =>
                oldest.last_fetch < data.last_fetch ? oldest : data
              );
              this.db.dataFetches.delete(old.id);
            }
          });
        }
      },
      error: (error) => {
        console.error(error.message);
      },
    };
    urls.forEach((url) => {
      this.papa.parse(url, options);
    });
  }
}
