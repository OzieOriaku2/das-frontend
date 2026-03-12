import { apiSlice } from './apiSlice'

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDigitizationReport: builder.query({
      query: (officeId) => `/reports/digitization${officeId ? `?officeId=${officeId}` : ''}`,
      providesTags: ['Pipeline'],
    }),

    getArchiveStats: builder.query({
      query: (period) => `/reports/archive-stats${period && period !== 'all' ? `?period=${period}` : ''}`,
      providesTags: ['ArchiveStats'],
    }),

    getReportByGender: builder.query({
      query: (period) => `/reports/by-gender${period && period !== 'all' ? `?period=${period}` : ''}`,
      providesTags: ['Reports'],
    }),

    getReportByOwnership: builder.query({
      query: (period) => `/reports/by-ownership${period && period !== 'all' ? `?period=${period}` : ''}`,
      providesTags: ['Reports'],
    }),

    getReportByOwnerType: builder.query({
      query: (period) => `/reports/by-owner-type${period && period !== 'all' ? `?period=${period}` : ''}`,
      providesTags: ['Reports'],
    }),

    getReportByDocType: builder.query({
      query: (period) => `/reports/by-doc-type${period && period !== 'all' ? `?period=${period}` : ''}`,
      providesTags: ['Reports'],
    }),
  }),
})

export const {
  useGetDigitizationReportQuery,
  useGetArchiveStatsQuery,
  useGetReportByGenderQuery,
  useGetReportByOwnershipQuery,
  useGetReportByOwnerTypeQuery,
  useGetReportByDocTypeQuery,
} = reportApiSlice
