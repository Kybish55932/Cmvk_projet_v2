from rest_framework.decorators import api_view
from rest_framework.response import Response
from app_direction.decorators import inspectors_required

@api_view(['GET'])
@inspectors_required
def violation_list(request):
    # ваша логика API
    return Response({'data': 'violations list'})

@api_view(['GET'])
@inspectors_required
def violation_detail(request, pk):
    # ваша логика API
    return Response({'data': f'violation detail {pk}'})