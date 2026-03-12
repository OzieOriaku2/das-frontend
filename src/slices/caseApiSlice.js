import { apiSlice } from './apiSlice'

export const caseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // ─── CASES ──────────────────────────────────────────────────────────

    getCases: builder.query({
      query: ({ stage, page = 1, pageSize = 20 } = {}) => {
        const params = new URLSearchParams()
        if (stage) params.set('stage', stage)
        params.set('page', page)
        params.set('pageSize', pageSize)
        return `/cases?${params}`
      },
      providesTags: (result) =>
        result
          ? [...result.cases.map((c) => ({ type: 'Cases', id: c.id })), { type: 'Cases', id: 'LIST' }]
          : [{ type: 'Cases', id: 'LIST' }],
    }),

    getCase: builder.query({
      query: (id) => `/cases/${id}`,
      providesTags: (result, error, id) => [{ type: 'Case', id }],
    }),

    createCase: builder.mutation({
      query: (data) => ({ url: '/cases', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Cases', id: 'LIST' }, 'Pipeline'],
    }),

    submitIndexing: builder.mutation({
      query: ({ caseId, metadata }) => ({
        url: `/cases/${caseId}/index`,
        method: 'PUT',
        body: metadata,
      }),
      invalidatesTags: (result, error, { caseId }) => [
        { type: 'Cases', id: 'LIST' },
        { type: 'Case', id: caseId },
        'Pipeline',
      ],
    }),

    qaApprove: builder.mutation({
      query: (caseId) => ({ url: `/cases/${caseId}/approve`, method: 'PUT' }),
      invalidatesTags: (result, error, caseId) => [
        { type: 'Cases', id: 'LIST' },
        { type: 'Case', id: caseId },
        'Pipeline',
        'ArchiveStats',
        'Reports',
      ],
    }),

    qaReject: builder.mutation({
      query: ({ caseId, reason }) => ({
        url: `/cases/${caseId}/reject`,
        method: 'PUT',
        body: { reason },
      }),
      invalidatesTags: (result, error, { caseId }) => [
        { type: 'Cases', id: 'LIST' },
        { type: 'Case', id: caseId },
        'Pipeline',
      ],
    }),

    editCase: builder.mutation({
      query: ({ caseId, changes, reason }) => ({
        url: `/cases/${caseId}/edit`,
        method: 'PUT',
        body: { changes, reason },
      }),
      invalidatesTags: (result, error, { caseId }) => [
        { type: 'Case', id: caseId },
        'ArchiveStats',
      ],
    }),

    getPipelineQueues: builder.query({
      query: () => '/cases/pipeline/queues',
      providesTags: ['Pipeline'],
    }),

    // ─── DOCUMENTS ──────────────────────────────────────────────────────

    getDocuments: builder.query({
      query: (caseId) => `/documents/${caseId}`,
      providesTags: (result, error, caseId) => [{ type: 'Documents', id: caseId }],
    }),

    uploadDocument: builder.mutation({
      query: ({ caseId, formData }) => ({
        url: `/documents/${caseId}/upload`,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { caseId }) => [
        { type: 'Documents', id: caseId },
        { type: 'Case', id: caseId },
        { type: 'Cases', id: 'LIST' },
      ],
    }),

    // ─── SEARCH ─────────────────────────────────────────────────────────

    searchCases: builder.query({
      query: (filters) => {
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.set(k, v)
        })
        return `/search?${params}`
      },
      providesTags: [{ type: 'Cases', id: 'SEARCH' }],
    }),
  }),
})

export const {
  useGetCasesQuery,
  useGetCaseQuery,
  useCreateCaseMutation,
  useSubmitIndexingMutation,
  useQaApproveMutation,
  useQaRejectMutation,
  useEditCaseMutation,
  useGetPipelineQueuesQuery,
  useGetDocumentsQuery,
  useUploadDocumentMutation,
  useSearchCasesQuery,
} = caseApiSlice
